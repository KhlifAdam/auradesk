"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface SortableListProps<T extends { id: string }> {
	items: T[];
	/** Called with the moved item's old and new index. */
	onMove: (from: number, to: number) => void;
	/** `handle` is the drag grip to place inside the item. */
	renderItem: (item: T, index: number, handle: ReactNode) => ReactNode;
	className?: string;
}

/**
 * Vertical drag-and-drop list moved by a grip, so the items can hold form
 * fields without a click in them starting a drag. Keyboard sorting works too.
 */
export function SortableList<T extends { id: string }>({
	items,
	onMove,
	renderItem,
	className,
}: SortableListProps<T>) {
	const dndId = useId();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		const from = items.findIndex((item) => item.id === active.id);
		const to = items.findIndex((item) => item.id === over.id);
		if (from !== -1 && to !== -1) onMove(from, to);
	};

	return (
		<DndContext
			id={dndId}
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={items.map((item) => item.id)}
				strategy={verticalListSortingStrategy}
			>
				<div className={className}>
					{items.map((item, index) => (
						<SortableRow key={item.id} id={item.id}>
							{(handle) => renderItem(item, index, handle)}
						</SortableRow>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

function SortableRow({
	id,
	children,
}: {
	id: string;
	children: (handle: ReactNode) => ReactNode;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const handle = (
		<button
			type="button"
			ref={setActivatorNodeRef}
			className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
			{...attributes}
			{...listeners}
		>
			<GripVertical className="h-4 w-4" />
		</button>
	);

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				isDragging && "relative z-10 opacity-90 shadow-luminous-lg",
			)}
		>
			{children(handle)}
		</div>
	);
}
