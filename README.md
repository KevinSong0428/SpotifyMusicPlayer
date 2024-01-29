
<a name="readme-top"></a>
# Spotify Music Controller

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#introduction">Introduction</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li><a href="#installation">Installation</a>
      <ul>
        <li><a href="#javascript-dependencies">JavaScript Dependencies</li>
        <li><a href="#python-dependencies">Python Dependencies</li>
      </ul>
    </li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#deploying-on-local-server">Deploying on Local Server</a></li>
  </ol>
</details>

## Introduction
<p>This project allows Spotify users to create or join a room to control a single Spotify session, primarily used for public settings such as a party, picnic or any hangout. </p>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [Django][Django-url]
* [React][React-url]
* [Spotify Web API][Spotify-url]
* [Python][Python-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Installation
### Clone Repository
* git clone `https://github.com/KevinSong0428/SpotifyMusicPlayer.git`
* Navigate to the folder where the repository was cloned.
### JavaScript Dependencies
* Navigate to the frontend folder of the project named `frontend` and run `npm install`.
### Python Dependencies  
* To install the required Python dependencies, navigate to the project's root directory and run: `pip install -r requirements.txt`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started
### Setting Up Spotify Web API Credentials
1) Create a Spotify Developer Account:
* If you don't have a Spotify Developer account, go to the [Spotify Developer Dashboard][Spotify-Dashboard] and sign up or log in.

2) Create a New App:
* Once logged in, create a new app on the Spotify Developer Dashboard.
* Provide a name and description for your app.

3) Get Client ID and Client Secret
* After creating the app, you'll receive a Client ID and a Client Secret.

4) Set Up Redirect URIs:
* In the Spotify Developer Dashboard, configure the Redirect URIs for your app. This is the URL where users will be redirected after granting access.


The project is currently for local development, please change in project settings and Spotify Developer Dashboard if you are planning to deploy it.

### Configure .env File
1) Create a .env file after navigating into the project repository
```
CLIENT_ID = your_client_id
CLIENT_SECRET = your_client_secret
REDIRECT_URI = your_redirect_URI
SECRET_KEY = django_secret_key
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Deploying on Local Server
To run the website on your local server, go to the project repository and run `python manage.py runserver` then in another terminal, navigate to the frontend folder, and run `npm run dev`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS -->
[Django-url]: https://docs.djangoproject.com/en/5.0/
[React-url]: https://react.dev/learn
[Python-url]: https://www.python.org/
[Spotify-url]: https://developer.spotify.com/documentation/web-api
[Spotify-Dashboard]: https://developer.spotify.com/
