from django.shortcuts import render
from rest_framework import generics, status
from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer
from .models import Room
from rest_framework.views import APIView # look at our API
from rest_framework.response import Response # send custom response from our view
from django.http import JsonResponse # use to serialize Python dictionary

# Create your views here.

# allows us to view and create Room
# class RoomView(generics.CreateAPIView): # <-- loads up to manually create entry
class RoomView(generics.ListAPIView): # <-- Shows data at api endpoint
    queryset = Room.objects.all() # <-- return ALL rooms
    serializer_class = RoomSerializer


class GetRoom(APIView):
    serializer_class = RoomSerializer
    lookup_url_kwarg = "code"

    def get(self, request, format=None):
        code = request.GET.get(self.lookup_url_kwarg)
        if code:
            # search room by UNIQUE code
            room = Room.objects.filter(code = code)
            
            if len(room) > 0:
                data = RoomSerializer(room[0]).data
                # compare the host id to the user who sent the request
                data["is_host"] = self.request.session.session_key == room[0].host
                return Response(data, status=status.HTTP_200_OK)
            return Response({"Room Not Found": "Invalid Room Code."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"Bad Request": "Code parameter not found in request."}, status=status.HTTP_400_BAD_REQUEST)


class JoinRoom(APIView):
    lookup_url_kwarg = "code"

    # POST request 
    def post(self, request, format=None):
        # check for active session
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        
        # post request so use data field not GET
        code = request.data.get(self.lookup_url_kwarg)

        # if code is NOT None, then filter roooms for the matching code
        if code:
            print("CODE FOUND!", code)
            roomResult = Room.objects.filter(code=code)
            print("ROOM FOUND!")
            if len(roomResult) > 0:
                room = roomResult[0]
                # telling session that this user is in THIS room
                self.request.session["room_code"] = room.code
                print(self.request.session["room_code"])
                return Response({"message": "Room Joined!"}, status=status.HTTP_200_OK)
            # if code doesn't match 
            return Response({"Bad Request": "Invalid Room Code."}, status=status.HTTP_400_BAD_REQUEST)
            
        # if no code
        return Response({"Bad Request": "Invalid post data, did not find a code key."}, status=status.HTTP_400_BAD_REQUEST)
            


# using APIView can define our get, post, and put method
class CreateRoomView(APIView):
    serializer_class = CreateRoomSerializer

    def post(self, request, format = None):
        # checking if current user has an active session with our web server
        if not self.request.session.exists(self.request.session.session_key):
            # if not, then create session
            self.request.session.create()
        
        # makes sure the request has the required fields
        serializer = self.serializer_class(data=request.data)
        # after serializing, if data is valid, then create the room
        if serializer.is_valid():
            guest_can_pause = serializer.data.get("guest_can_pause")
            votes_to_skip = serializer.data.get("votes_to_skip")
            host = self.request.session.session_key

            # see if host is already hosting another room, if so, grab their current room and simply update the two parameters
            queryset = Room.objects.filter(host = host)
            if queryset.exists():
                room = queryset[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                # pass in the fields we wish to update
                room.save(update_fields=["guest_can_pause", "votes_to_skip"])
                # save room code in session
                self.request.session["room_code"] = room.code
                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
            # ELSE we need to create a new room
            else:
                room = Room(host=host, guest_can_pause=guest_can_pause, votes_to_skip=votes_to_skip)
                room.save()
                self.request.session["room_code"] = room.code
                return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

        return Response({'Bad Request': 'Invalid data...'}, status=status.HTTP_400_BAD_REQUEST)    
    

class UserInRoom(APIView):
    def get(self, request, format=None):

        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = {
            "code": self.request.session.get("room_code")
        }
        # takes a Python dictionary and serializes it using a Json serializer
        return JsonResponse(data, status=status.HTTP_200_OK)


# API to hit when leaving room --> POST request to change information on server
class LeaveRoom(APIView):
    def post(self, request, format=None):
        print(self.request.session["room_code"])
        if "room_code" in self.request.session:
            # POPPING room code from session
            self.request.session.pop("room_code")

            # AND if user is the host when popping, need to DELETE the room
            host_id = self.request.session.session_key
            roomResult = Room.objects.filter(host=host_id)
            # check if results exists
            if not roomResult.exists():
                return Response({"message":"Room not found."}, status=status.HTTP_404_NOT_FOUND)
            else:
            # if len(roomResult) > 0: <-- another way but we should use .exists for queries
                room = roomResult[0]
                room.delete()

        return Response({"Message":"Success"}, status=status.HTTP_200_OK)
    

# VERY similary to create room BUT we want to create another view class for future parameters and other additions
class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer
    # PUT
    def patch(self, request, format=None):
        # check if session exists
        if not self.request.session.exists(self.request.session.session_key):
            # if not, then create session
            self.request.session.create()   

        # makes sure the request has the required fields
        serializer = self.serializer_class(data=request.data)
        # after serializing, if data is valid, then update the room
        if serializer.is_valid():
            guest_can_pause = serializer.data.get("guest_can_pause")
            votes_to_skip = serializer.data.get("votes_to_skip")
            code = serializer.data.get("code")

            # find room with this code
            queryset = Room.objects.filter(code=code)
            # check if results exists
            if not queryset.exists():
                print("Room not found")
                return Response({"message":"Room not found."}, status=status.HTTP_404_NOT_FOUND)
            room = queryset[0]

            # get session id and compare with host of room
            # only host can update room fields
            userID = self.request.session.session_key
            if room.host != userID:
                print("You are not the host, you cannot update!")
                return Response({"message":"You are not the host of this room."}, status=status.HTTP_403_FORBIDDEN)
            
            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields=["guest_can_pause", "votes_to_skip"])
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        return Response({"Bad Request": "Invalid Data..."}, status=status.HTTP_400_BAD_REQUEST)