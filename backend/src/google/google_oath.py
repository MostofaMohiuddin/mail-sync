import google_auth_oauthlib.flow

from src.common.exceptions.http import BadRequestException
from src.env_config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_BASE_URI,
    GOOGLE_OAUTH_CERT_URL,
    GOOGLE_PROJECT_ID,
    GOOGLE_REDIRECT_URI,
    GOOGLE_TOKEN_URI,
)

from .models import GoogleOAuthCredentials

CLIENT_CONFIG = {
    "web": {
        "client_id": GOOGLE_CLIENT_ID,
        "project_id": GOOGLE_PROJECT_ID,
        "auth_uri": GOOGLE_OAUTH_BASE_URI,
        "token_uri": GOOGLE_TOKEN_URI,
        "auth_provider_x509_cert_url": GOOGLE_OAUTH_CERT_URL,
        "client_secret": GOOGLE_CLIENT_SECRET,
    }
}


class GoogleOauthService:
    def __init__(self):
        self.scopes = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "openid",
            "https://mail.google.com/",
        ]

        self.google_oath_flow = google_auth_oauthlib.flow.Flow.from_client_config(
            client_config=CLIENT_CONFIG, scopes=self.scopes
        )
        self.google_oath_flow.redirect_uri = GOOGLE_REDIRECT_URI

    def get_auth_url(self):
        authorization_url, _ = self.google_oath_flow.authorization_url(
            # Enable offline access so that you can refresh an access token without
            # re-prompting the user for permission. Recommended for web server apps.
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )
        return authorization_url

    def get_google_oauth_credentials(self, code: str) -> GoogleOAuthCredentials:
        try:
            self.google_oath_flow.fetch_token(code=code)
            credentials = self.google_oath_flow.credentials
            return GoogleOAuthCredentials(
                **{
                    "token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "token_uri": credentials.token_uri,
                    "client_id": credentials.client_id,
                    "client_secret": credentials.client_secret,
                    "scopes": credentials.scopes,
                }
            )
        except Exception as e:
            print(e)
            raise BadRequestException(detail="Invalid code") from e
