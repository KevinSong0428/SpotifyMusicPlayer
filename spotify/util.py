from .models import SpotifyToken
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from requests import post, put, get

# BASE_URL for retrieving current song, skipping, play, pause, adding to and retriving queue
BASE_URL = "https://api.spotify.com/v1/me/"
# SEARCH_URL for searching song
SEARCH_URL = "https://api.spotify.com/v1/"

def get_user_tokens(session_id):
    user_tokens = SpotifyToken.objects.filter(user=session_id)
    if user_tokens.exists():
        return user_tokens[0]
    return None

def get_device_id(session_id):
    tokens = get_user_tokens(session_id)
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + tokens.access_token
    }
    response = get(BASE_URL + "player/devices", headers=headers)
    return response.json()["devices"][0]["id"]

# fucntion to save/create our token
def update_or_create_user_token(session_id, access_token, token_type, expires_in, refresh_token):
    tokens = get_user_tokens(session_id)
    # token expires_in = 3600 seconds = 1 hours --> convert to timedelta in order to add to timezone format
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    # UPDATING TOKEN IF INSTANCE EXISTS
    if tokens:
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.token_type = token_type
        tokens.save(update_fields=["access_token", "refresh_token", "expires_in", "token_type"])
    # OR CREATE TOKEN INSTANCE
    else:
        tokens = SpotifyToken(
            user=session_id,
            refresh_token=refresh_token,
            access_token=access_token,
            expires_in=expires_in,
            token_type=token_type
            )
        tokens.save()
    

# check if session user is authenticated
def is_spotify_authenticated(session_id):
    tokens = get_user_tokens(session_id)
    if tokens:
        expiry = tokens.expires_in
        # if token is already expired, refresh token!
        if expiry <= timezone.now():
            refresh_spotify_token(session_id)
        # we our token is good, then refresh then return True - meaning user is authenticated!
        return True
    return False

def refresh_spotify_token(session_id):
    refresh_token = get_user_tokens(session_id).refresh_token

    response = post("https://accounts.spotify.com/api/token", data ={
        "grant_type": "refresh_token", # we want to send refresh token
        "refresh_token": refresh_token,
        "client_id": settings.CLIENT_ID,
        "client_secret": settings.CLIENT_SECRET
    }).json()
    print("RESPONSE: ", response, "\n")

    # response will send back a new access token and refresh token
    access_token = response.get("access_token")
    token_type = response.get("token_type")
    expires_in = response.get("expires_in")
    update_or_create_user_token(session_id, access_token, token_type, expires_in, refresh_token)


# use to execute any types of spotify api request - default not a post nor put request
def execute_spotify_api_request(session_id, endpoint, post_=False, put_=False):
    tokens = get_user_tokens(session_id)
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + tokens.access_token
    }
    try:
        # sending post request
        if post_:
            response = post(BASE_URL + endpoint, headers=headers)

        if put_:
            response = put(BASE_URL + endpoint, headers=headers)

        response = get(BASE_URL + endpoint, {}, headers=headers)
        return response.json()
    except Exception as e:
        return {"Error": f"Issue with request. {str(e)}"}


def search(session_id, endpoint):
    tokens = get_user_tokens(session_id)
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + tokens.access_token
    }

    response = get(SEARCH_URL + endpoint, {}, headers=headers)

    try:
        return response.json()
    except Exception as e:
        return {"Error": f"Issue with request. {str(e)}"}
    

def play_selected_song(session_id, track, device_id):
    tokens = get_user_tokens(session_id)

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + tokens.access_token,
        "device_id": device_id,
    }
    data = {"uris": [track]}
    # data = {
    #     "uris": ["spotify:track:0bYg9bo50gSsH3LtXe2SQn"],
    # }
    print(data)
    try:
        response = put(BASE_URL + "player/play", json=data, headers=headers)
        if response.status_code in [200, 204]:
            return {"Success": "Track is playing"}
        else:
            return {"Error": f"Failed to play track: {response.status_code}, {response.text}"}
    except Exception as e:
        return {"Error": f"Issue with request: {str(e)}"}

def add_to_queue(session_id, track_uri, device_id):
    tokens = get_user_tokens(session_id)

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + tokens.access_token,
        "device_id": device_id,
    }
    try:
        response = post(BASE_URL + "player/queue?uri=" + track_uri, headers=headers)
        if response.status_code in [200, 204]:
            return {"Success": "Track is added to queue."}
        else:
            return {"Error": f"Failed to add track to queue: {response.status_code}, {response.text}"}
    except Exception as e:
        return {"Error": f"Issue with request: {str(e)}"}

def play_or_pause_song(session_id, state):
    return execute_spotify_api_request(session_id, f"player/{state}", put_=True)

def skip_song(session_id):
    return execute_spotify_api_request(session_id, "player/next", post_=True)


def ms_to_min_sec(ms):
    sec, ms = divmod(ms, 1000)
    min, sec = divmod(sec, 60)
    return f"{min:02d}:{sec:02d}"
