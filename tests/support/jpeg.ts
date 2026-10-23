import sharp from "sharp";

/** A small JPEG carrying a camera, a capture date and a GPS position. */
export function jpegWithGps() {
	return sharp({
		create: { width: 40, height: 30, channels: 3, background: "#888" },
	})
		.withExif({
			IFD0: { Make: "SONY", Model: "ILCE-7M4" },
			IFD2: { DateTimeOriginal: "2026:09:12 14:03:51" },
			IFD3: {
				GPSLatitudeRef: "N",
				GPSLatitude: "36/1 48/1 30/1",
				GPSLongitudeRef: "E",
				GPSLongitude: "10/1 10/1 12/1",
			},
		})
		.withXmp(
			`<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:exif="http://ns.adobe.com/exif/1.0/" exif:GPSLatitude="36,48.5N"/></rdf:RDF></x:xmpmeta>`,
		)
		.jpeg()
		.toBuffer();
}
