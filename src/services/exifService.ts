import exifr from 'exifr';

export interface ExtractedExifData {
  cameraModel?: string;
  lens?: string;
  focalLength?: string;
  iso?: number;
  shutterSpeed?: string;
  aperture?: string;
  orientation?: number;
  dateTimeOriginal?: string;
  width?: number;
  height?: number;
}

/**
 * Formats exposure time into human readable shutter speed (e.g. 0.001 -> 1/1000s, 0.5 -> 1/2s, 2 -> 2s)
 */
function formatShutterSpeed(seconds?: number): string | undefined {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return undefined;
  if (seconds >= 1) {
    return `${parseFloat(seconds.toFixed(1))}s`;
  }
  const reciprocal = Math.round(1 / seconds);
  return `1/${reciprocal}s`;
}

/**
 * Formats aperture F-number (e.g. 1.4 -> f/1.4, 2.8 -> f/2.8)
 */
function formatAperture(fnumber?: number): string | undefined {
  if (!fnumber || isNaN(fnumber)) return undefined;
  return `f/${parseFloat(fnumber.toFixed(1))}`;
}

/**
 * Formats focal length (e.g. 50 -> 50mm)
 */
function formatFocalLength(focal?: number): string | undefined {
  if (!focal || isNaN(focal)) return undefined;
  return `${Math.round(focal)}mm`;
}

/**
 * Extracts real camera and exposure parameters from a file
 */
export async function extractExifFromFile(file: File | Blob): Promise<ExtractedExifData> {
  try {
    const rawData = await exifr.parse(file, [
      'Make',
      'Model',
      'LensModel',
      'LensMake',
      'FocalLength',
      'FNumber',
      'ISO',
      'ExposureTime',
      'ShutterSpeedValue',
      'DateTimeOriginal',
      'Orientation',
      'ImageWidth',
      'ImageHeight',
      'ExifImageWidth',
      'ExifImageHeight',
    ]);

    if (!rawData) {
      return {};
    }

    let cameraModel: string | undefined = undefined;
    const make = (rawData.Make || '').trim();
    const model = (rawData.Model || '').trim();

    if (model) {
      if (make && !model.toLowerCase().includes(make.toLowerCase())) {
        cameraModel = `${make} ${model}`;
      } else {
        cameraModel = model;
      }
    } else if (make) {
      cameraModel = make;
    }

    const lens = rawData.LensModel?.trim() || rawData.LensMake?.trim();
    const focalLength = formatFocalLength(rawData.FocalLength);
    const aperture = formatAperture(rawData.FNumber);
    const shutterSpeed = formatShutterSpeed(rawData.ExposureTime);
    const iso = rawData.ISO ? Number(rawData.ISO) : undefined;

    return {
      cameraModel,
      lens,
      focalLength,
      iso,
      shutterSpeed,
      aperture,
      orientation: rawData.Orientation,
      dateTimeOriginal: rawData.DateTimeOriginal ? new Date(rawData.DateTimeOriginal).toISOString() : undefined,
      width: rawData.ExifImageWidth || rawData.ImageWidth,
      height: rawData.ExifImageHeight || rawData.ImageHeight,
    };
  } catch (error) {
    console.warn('Notice: Could not parse EXIF data from file:', error);
    return {};
  }
}
