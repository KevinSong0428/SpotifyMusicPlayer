from django.shortcuts import render, redirect
from django.conf import settings # import django settings to access env variables
from rest_framework.views import APIView
from requests import Request, post
from rest_framework import status
from rest_framework.response import Response
from .util import *
from api.models import Room
from .models import Vote

# View to authenticate application to access data
class AuthURL(APIView):
    def get(self, request, format=None):
        print("AUTH URL AUTHENTICATING")
        # scope is information we want to access
        scopes = "user-read-playback-state user-modify-playback-state user-read-currently-playing"

        # prepare url
        url = Request("GET", "http://accounts.spotify.com/authorize", params={
            "scope" : scopes,
            "response_type" : "code",
            "redirect_uri" : settings.REDIRECT_URI,
            "client_id": settings.CLIENT_ID,
        }).prepare().url

        return Response({"url": url}, status=status.HTTP_200_OK)
    

# after we return the information from AuthURL, we will then pass that information to this callback function --> then send request with code to get access tokens
def spotify_callback(request, format=None):
    print("CALLBACK FUNCTION!!!")
    code = request.GET.get("code")
    error = request.GET.get("error")

    # to access tokens - need code, redirect uri and grant type
    response = post("https://accounts.spotify.com/api/token", data={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.REDIRECT_URI,
        "client_id": settings.CLIENT_ID,
        "client_secret": settings.CLIENT_SECRET
    }).json()

    # want to store in database - spotify token model
    access_token = response.get("access_token")
    token_type = response.get("token_type")
    refresh_token = response.get("refresh_token")
    expires_in = response.get("expires_in")
    error = response.get("error")

    if not request.session.exists(request.session.session_key):
        request.session.create()
    update_or_create_user_token(request.session.session_key, access_token, token_type, expires_in, refresh_token)

    # redirecting to a different app
    # "APP_NAME:"
    return redirect("frontend:")


class IsAuthenticated(APIView):
    def get(self, request, format=None):
        if not request.session.exists(self.request.session.session_key):
            self.request.session.create()
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)
        
        # after authenticating user, store device id to room that way any changes to music player will affect the ROOM'S music player (aka host device)
        room = getRoom(self.request.session.get("room_code"))
        if is_authenticated:
            room.device_id = get_device_id(room.host)
            room.save(update_fields=["device_id"])
        return Response({"status": is_authenticated}, status=status.HTTP_200_OK)
    
class CurrentSong(APIView):
    def get(self, request, format=None):
        room = getRoom(self.request.session.get("room_code"))
        host = room.host
        endpoint = "player/currently-playing" 

        response = execute_spotify_api_request(host, endpoint)
        
        # item includes song details
        if "error" in response or "item" not in response:
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        item = response.get("item")
        duration = item.get("duration_ms")
        progress = response.get("progress_ms")
        album = item.get("album")
        album_cover = album.get("images")[0].get("url")
        is_playing = response.get("is_playing")
        song_id = item.get("id")

        artist_string = ""
        for i, artist in enumerate(item.get("artists")):
            if i > 0:
                artist_string += ", "
            name = artist.get("name")
            artist_string += name
        votes = len(Vote.objects.filter(room=room, song_id=song_id))

        song = {
            "title": item.get("name"),
            "artist": artist_string,
            "duration": duration,
            "time": progress,
            "image_url": album_cover,
            "is_playing": is_playing,
            "votes": votes,
            "votes_required": room.votes_to_skip,
            "id": song_id,
            "converted_progress": ms_to_min_sec(progress),
            "converted_duration": ms_to_min_sec(duration)
        }

        # check and updated every time we get song
        self.update_room_song(room, song_id)

        # return Response(response, status=status.HTTP_200_OK)
        return Response(song, status=status.HTTP_200_OK)
    
    def update_room_song(self, room, song_id):
        current_song = room.current_song
        
        # only update IF the song has been changed!
        if current_song != song_id:
            room.current_song = song_id
            # update song in the room object
            room.save(update_fields=["current_song"])
            # delte votes for the room
            votes = Vote.objects.filter(room=room).delete()


class PauseSong(APIView):
    # send put request to Spotify to update state of our song
    def put(self, response, format=None):
        room = getRoom(self.request.session.get("room_code"))
        # check if current user is a host
        # OR see if guest_can_pause is True
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_or_pause_song(room.host, "pause")
            # successful request, return no content
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        # if not allowed, forbidden error
        return Response({}, status=status.HTTP_403_FORBIDDEN)

class PlaySong(APIView):
    # send put request to Spotify to update state of our song
    def put(self, response, format=None):
        room = getRoom(self.request.session.get("room_code"))
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_or_pause_song(room.host, "play")
            # successful request, return no content
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        
        # if not allowed, forbidden error
        return Response({}, status=status.HTTP_403_FORBIDDEN)
    

# when clicked, want to show x votes out of votes needed to skip
# once skipped, reset counter
class SkipSong(APIView):
    # creating new data aka new song
    def post(self, request, format=None):
        room = getRoom(self.request.session.get("room_code"))
        # prevent user from voting multiple times
        user = self.request.session.session_key
        if Vote.objects.filter(user=user).exists():
            return Response({"message": "Already voted."}, status=status.HTTP_204_NO_CONTENT)

        # only want to grab from the room and votes from that current song!
        votes = Vote.objects.filter(room=room, song_id=room.current_song)
        votes_needed = room.votes_to_skip

        # if user is host of room, don't need vote
        if user == room.host or len(votes) + 1 >= votes_needed :
            #  clear all votes the song previously had
            votes.delete()
            skip_song(room.host)
            
        else:
            # create a new Vote object 
            vote = Vote(user=self.request.session.session_key, room=room, song_id=room.current_song)
            vote.save()

        return Response({}, status=status.HTTP_204_NO_CONTENT)
    
class SearchSong(APIView):
    def get(self, request, format=None):
        print("Searching song:")
        room = getRoom(self.request.session.get("room_code"))
        host = room.host
        search_query = request.GET.get('q', '') # extract search query

        if not search_query:
            return Response({"Error":"Search query not provided"}, status=status.HTTP_400_BAD_REQUEST)

        endpoint = f"search?q={search_query}&type=track%2Cartist"
        response = search(host, endpoint)

        if "Error" in response:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        
        items = response["tracks"]["items"]
        songs = []
        for item in items:
            song = {}
            song["id"] = item["id"]
            song["title"] = item["name"]
            song["track_uri"] = item["uri"]
            song["image_url"] = item["album"]["images"][0]["url"] if item["album"]["images"] else "https://images.pexels.com/photos/1135995/pexels-photo-1135995.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            song["length"] = ms_to_min_sec(item["duration_ms"])# length of song
            artist_string = ""
            for i, artist in enumerate(item.get("artists")):
                if i > 0:
                    artist_string += ", "
                name = artist.get("name")
                artist_string += name
            song["artist"] = artist_string
            songs.append(song)

        return Response(songs, status=status.HTTP_200_OK)
        
class PlaySelectedSong(APIView):
    def get(self, request, format=None):
        room = getRoom(self.request.session.get("room_code"))
        host = room.host
        device_id = room.device_id
        track_uri = request.GET.get('q', '') # extract search query

        if not track_uri:
            return Response({"Error":"Search query not provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        response = play_selected_song(host, track_uri, device_id)
        print(response)
        if "Error" in response:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({}, status=status.HTTP_204_NO_CONTENT)
    
class GetQueue(APIView):
    def get(self, request, format=None):
        room = getRoom(self.request.session.get("room_code"))
        host = room.host
        endpoint = "player/queue"
        response = execute_spotify_api_request(host, endpoint)
        
        if "Error" in response:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        
        queue = response["queue"]
        songs = []
        for item in queue:
            song = {}
            song["id"] = item["id"]
            song["title"] = item["name"]
            song["track_uri"] = item["uri"]
            song["image_url"] = item["album"]["images"][0]["url"] if item["album"]["images"] else "https://images.pexels.com/photos/1135995/pexels-photo-1135995.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            song["length"] = ms_to_min_sec(item["duration_ms"])# length of song
            artist_string = ""
            for i, artist in enumerate(item.get("artists")):
                if i > 0:
                    artist_string += ", "
                name = artist.get("name")
                artist_string += name
            song["artist"] = artist_string
            songs.append(song)

        return Response(songs, status=status.HTTP_200_OK)
    

class AddToQueue(APIView):
    def post(self, request, format=None):
        room = getRoom(self.request.session.get("room_code"))
        host = room.host
        device_id = room.device_id
        track_uri = request.GET.get('q', '') # extract search query

        response = add_to_queue(host, track_uri, device_id)

        if "Error" in response:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
       
        return Response({}, status=status.HTTP_204_NO_CONTENT)
    
class GetUser(APIView):
    def get(self, request, format=None):
        host = getRoom(self.request.session.get("room_code")).host
        response = execute_spotify_api_request(host, '')

        if "Error" in response:
            return Response({}, status=status.HTTP_404_NOT_FOUND)

        image_url = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"

        if response.get("images"):
            image_url = response.get("images")[1]["url"]

        name = " ".join(word[0].upper() + word[1:].lower() for word in response.get("display_name").split())

        user = {
            "name": name,
            "image_url": image_url
        }

        return Response(user, status=status.HTTP_200_OK)