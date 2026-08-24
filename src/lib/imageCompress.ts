// Compresses an image to WebP, max width, iteratively reducing quality
// until the file is at or under the target size. Stops at quality 0.1 to
// avoid making images unrecognisably bad on very large source files.
export const compressImage = (file: File, maxWidth = 800, targetSizeKB = 65): Promise<File> =>
  new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);

      let quality = 0.75;
      const attempt = () => {
        canvas.toBlob(
          blob => {
            if (!blob) return resolve(new File([], file.name, { type: 'image/webp' }));
            if (blob.size / 1024 <= targetSizeKB || quality <= 0.1) {
              resolve(new File([blob], file.name, { type: 'image/webp' }));
            } else {
              quality -= 0.05;
              attempt();
            }
          },
          'image/webp',
          quality
        );
      };
      attempt();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
