import google_auth_oauthlib.flow

from src.common.exceptions.http import BadRequestException
from src.env_config import GOOGLE_REDIRECT_URI

from .models import GoogleOAuthCredentials


class GoogleOauthService:
    def __init__(self):
        self.scopes = [
            "https://www.googleapis.com/auth/userinfo.email",
            "openid",
            "https://mail.google.com/",
        ]
        CLIENT_CONFIG = {
            "web": {
                "client_id": "394638145623-mofp9qn2s2bn55f2h2f3q7rv1van8690.apps.googleusercontent.com",
                "project_id": "mail-sync-413222",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": "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",
            }
        }
        self.google_oath_flow = google_auth_oauthlib.flow.Flow.from_client_config(
            client_config=CLIENT_CONFIG, scopes=self.scopes
        )
        self.google_oath_flow.redirect_uri = GOOGLE_REDIRECT_URI

    def get_auth_url(self):
        # return f"{GOOGLE_OAUTH_BASE_URI}?client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&access_type=offline&response_type=code&scope={' '.join(self.scopes)}"
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
            raise BadRequestException(detail="Invalid code") from e
