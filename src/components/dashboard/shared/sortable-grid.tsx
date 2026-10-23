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
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface SortableGridProps<T extends { id: string }> {
	items: T[];
	onReorder: (items: T[]) => void;
	renderItem: (item: T) => ReactNode;
	className?: string;
	disabled?: boolean;
}

/**
 * Drag-and-drop grid. A small activation distance keeps clicks on items
 * (links, buttons) working; keyboard sorting is supported too.
 */
export function SortableGrid<T extends { id: string }>({
	items,
	onReorder,
	renderItem,
	className,
	disabled,
}: SortableGridProps<T>) {
	// dnd-kit numbers its accessibility ids with a counter that differs between
	// the server and the browser; React's id is the same on both.
	const dndId = useId();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		const from = items.findIndex((item) => item.id === active.id);
		const to = items.findIndex((item) => item.id === over.id);
		if (from !== -1 && to !== -1) onReorder(arrayMove(items, from, to));
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
				strategy={rectSortingStrategy}
				disabled={disabled}
			>
				<div className={className}>
					{items.map((item) => (
						<SortableItem key={item.id} id={item.id}>
							{renderItem(item)}
						</SortableItem>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

function SortableItem({ id, children }: { id: string; children: ReactNode }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"touch-none",
				isDragging && "relative z-10 opacity-80 shadow-luminous-lg",
			)}
			{...attributes}
			{...listeners}
		>
			{children}
		</div>
	);
}
