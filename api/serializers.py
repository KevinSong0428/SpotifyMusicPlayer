# take all of data from Room model and translate into JSON reponse
from rest_framework import serializers
from .models import Room

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        # identifty model we wish to serialize
        model = Room
        # list of fields we want from Room model
        fields = ('id', 'code', 'host', 'guest_can_pause', 'votes_to_skip', 'created_at')
    
class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        
        # These fields required when using this serializer - write the fields we want sent as a response
        fields = ("guest_can_pause", "votes_to_skip")
    
class UpdateRoomSerializer(serializers.ModelSerializer):
    # redefining the code field so it's not from the room model
    # code doesn't have to be unique when updating (we actually WANT that code since we're not creating, we're searching for a room with that code)
    code = serializers.CharField(validators=[])
    class Meta:
        model = Room
        # These fields required when using this serializer
        # don't need to pass in unique code to updating room --> will have already exist
        fields = ("guest_can_pause", "votes_to_skip", "code")
    
