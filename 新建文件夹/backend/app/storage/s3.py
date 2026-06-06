class S3Storage:
    def __init__(self, bucket: str):
        self.bucket = bucket

    def save(self, filename: str, data: bytes):
        return ""

    def get_url(self, filename: str):
        return ""
