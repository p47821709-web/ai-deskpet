from PIL import Image

def resize_image(path: str, size: tuple):
    img = Image.open(path)
    return img.resize(size, Image.NEAREST)

def to_pixel_art(path: str, pixel_size: int = 16):
    img = Image.open(path)
    small = img.resize((pixel_size, pixel_size), Image.NEAREST)
    return small
