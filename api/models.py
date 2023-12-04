from django.db import models
import string
import random

def generate_unique_code():
    length = 6

    while True:
        code = ''.join(random.choices(string.ascii_uppercase, k = length))
        # compare generated code with all codes of Room models --> if filtering and there are no counts of the same, then break
        if Room.objects.filter(code=code).count() == 0:
            break
    return code

# models.Model defines a model
class Room(models.Model):
    code = models.CharField(max_length=8, default=generate_unique_code, unique=True)
    # identify users based on session IDs
    host = models.CharField(max_length=50, unique=True)
    # null = False means must pass in a value
    guest_can_pause = models.BooleanField(null=False, default=False)
    votes_to_skip = models.IntegerField(null=False, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # needs to have null = True since no song played at first is okay
    current_song = models.CharField(max_length=50, null=True)
    device_id = models.CharField(max_length=50, null=True)
