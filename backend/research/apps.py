from django.apps import AppConfig


class ResearchConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'research'

    def ready(self):
        # Import signals if needed in future
        try:
            import research.signals  # noqa: F401
        except Exception:
            pass