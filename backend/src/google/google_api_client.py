import googleapiclient.discovery

import google.oauth2.credentials

from .models import GoogleOAuthCredentials, UserInfo


class GoogleApiClient:
    def __init__(
        self,
        credentials: GoogleOAuthCredentials,
    ):
        self.google_oauth_credentials = google.oauth2.credentials.Credentials(**credentials.dict())

    def get_user_info(self) -> UserInfo:
        service = googleapiclient.discovery.build("oauth2", "v2", credentials=self.google_oauth_credentials)
        user = service.userinfo().get().execute()
        return UserInfo(**user)
