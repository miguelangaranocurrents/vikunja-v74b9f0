import type {Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain-text rendition of copied editor content. ProseMirror's default serializer
// joins the text of every block and loses the list markers, so a copied bullet list
// would paste as bare lines. This keeps list markers and nesting visible in text/plain.

function listMarker(list: ProseMirrorNode, item: ProseMirrorNode, ordinal: number): string {
	switch (list.type.name) {
		case 'orderedList':
			return `${ordinal}. `
		case 'taskList':
			return `- [${item.attrs.checked ? 'x' : ' '}] `
		default:
			return '- '
	}
}

function listLines(list: ProseMirrorNode, indent: string): string[] {
	const lines: string[] = []
	let ordinal = 1

	list.forEach(item => {
		const marker = listMarker(list, item, ordinal++)
		const continuation = ' '.repeat(marker.length)
		const body = blockLines(item, '')

		if (body.length === 0) {
			lines.push(indent + marker.trimEnd())
			return
		}

		body.forEach((line, i) => lines.push(indent + (i === 0 ? marker : continuation) + line))
	})

	return lines
}

function blockLines(node: ProseMirrorNode, indent: string): string[] {
	if (['bulletList', 'orderedList', 'taskList'].includes(node.type.name)) {
		return listLines(node, indent)
	}

	if (node.isTextblock) {
		return [indent + node.textBetween(0, node.content.size, undefined, '\n')]
	}

	const lines: string[] = []
	node.forEach(child => lines.push(...blockLines(child, indent)))
	return lines
}

export function serializeSliceAsText(slice: Slice): string {
	const lines: string[] = []
	slice.content.forEach(node => lines.push(...blockLines(node, '')))
	return lines.join('\n')
}
