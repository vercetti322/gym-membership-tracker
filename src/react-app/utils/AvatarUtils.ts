const PHOTO_SIZE = 256;
const JPEG_QUALITY = 0.8;
const MAX_INPUT_SIZE = 10 * 1024 * 1024;

export async function processMemberPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image.');
  }

  if (file.size > MAX_INPUT_SIZE) {
    throw new Error('Image must be smaller than 10 MB.');
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to read this image.'));
      image.src = imageUrl;
    });

    const side = Math.min(image.naturalWidth, image.naturalHeight);

    if (!side) {
      throw new Error('Invalid image dimensions.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_SIZE;
    canvas.height = PHOTO_SIZE;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to process this image.');
    }

    const sx = (image.naturalWidth - side) / 2;
    const sy = (image.naturalHeight - side) / 2;

    context.drawImage(image, sx, sy, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error('Unable to compress this image.'));
            return;
          }

          resolve(result);
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    });

    if (blob.type !== 'image/jpeg') {
      throw new Error('JPEG conversion is not supported by this browser.');
    }

    return blob;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
