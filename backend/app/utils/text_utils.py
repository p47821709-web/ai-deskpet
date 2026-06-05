def truncate(text: str, max_length: int = 1000):
    if len(text) > max_length:
        return text[:max_length] + "..."
    return text
