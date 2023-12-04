from django.db import models
from api.models import Room

# model to store token
class SpotifyToken(models.Model):
    user = models.CharField(max_length=50, unique=True) # session key
    created_at = models.DateTimeField(auto_now_add=True)
    refresh_token = models.CharField(max_length=255)
    access_token = models.CharField(max_length=150)
    expires_in = models.DateTimeField()
    token_type = models.CharField(max_length=50)

class Vote(models.Model):
    # who voted, what room they voted in, what song they voted to skip
    # when a new song is played, need to update the model and clear!
    user = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    song_id = models.CharField(max_length=50)

    # foreign key - pass in instance of another object --> stores a reference to the room
    room = models.ForeignKey(Room, on_delete=models.CASCADE) # if room was deleted, anything referencing the room will be deleted 