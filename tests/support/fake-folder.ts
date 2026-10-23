// In-memory stand-ins for the browser's folder handles (File System Access
// API), enough for collect-originals to walk, read and write.

class FakeFile {
	readonly kind = "file";
	constructor(
		readonly name: string,
		public data: Uint8Array<ArrayBuffer>,
		readonly lastModified = 1000,
	) {}
	async getFile() {
		return new File([this.data], this.name, { lastModified: this.lastModified });
	}
	async createWritable() {
		const chunks: Uint8Array[] = [];
		return new WritableStream<Uint8Array>({
			write: (chunk) => void chunks.push(chunk),
			close: () => {
				this.data = new Uint8Array(Buffer.concat(chunks));
			},
		});
	}
}

export class FakeFolder {
	readonly kind = "directory";
	readonly children = new Map<string, FakeFile | FakeFolder>();
	constructor(readonly name: string) {}
	async *entries() {
		yield* this.children.entries();
	}
	async getDirectoryHandle(name: string, options?: { create?: boolean }) {
		if (!this.children.has(name) && options?.create)
			this.children.set(name, new FakeFolder(name));
		const child = this.children.get(name);
		if (!(child instanceof FakeFolder)) throw new Error("NotFoundError");
		return child;
	}
	async getFileHandle(name: string, options?: { create?: boolean }) {
		if (!this.children.has(name) && options?.create)
			this.children.set(name, new FakeFile(name, new Uint8Array()));
		const child = this.children.get(name);
		if (!(child instanceof FakeFile)) throw new Error("NotFoundError");
		return child;
	}
	async isSameEntry(other: unknown) {
		return other === this;
	}
	folder(name: string) {
		const folder = new FakeFolder(name);
		this.children.set(name, folder);
		return folder;
	}
	file(name: string, bytes: number, fill: number, lastModified = 1000) {
		this.children.set(name, new FakeFile(name, new Uint8Array(bytes).fill(fill), lastModified));
		return this;
	}
	read(name: string) {
		return (this.children.get(name) as FakeFile).data;
	}
}
