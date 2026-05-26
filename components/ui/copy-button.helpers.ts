export interface ClipboardLike {
  writeText: (text: string) => Promise<void>;
}

export async function writeTextToClipboard(
  text: string,
  clipboard: ClipboardLike = navigator.clipboard
): Promise<void> {
  await clipboard.writeText(text);
}