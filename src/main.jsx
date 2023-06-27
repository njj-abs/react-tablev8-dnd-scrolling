import React from "react"
import ReactDOM from "react-dom/client"

import "./index.css"
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table"
import { makeData } from "./makeData"
import { useVirtual } from "react-virtual"
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";



const DraggableRow = ({ row, reorderRow }) => {
	const [, dropRef] = useDrop({
	  accept: "row",
	  drop: (draggedRow) => reorderRow(draggedRow.index, row.index),
	});
  
	const [{ isDragging }, dragRef, previewRef] = useDrag({
	  collect: (monitor) => ({
		isDragging: monitor.isDragging(),
	  }),
	  item: () => row,
	  type: "row",
	});
  
	return (
	  <tr
		//previewRef could go here
		ref={(node) => dragRef(dropRef(node))}
		style={{ opacity: isDragging ? 0.5 : 1 }}
	  >
	
		{row.getVisibleCells().map((cell) => (
		  <td key={cell.id}>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		  </td>
		))}
	  </tr>
	);
  };

function App() {
	const rerender = React.useReducer(() => ({}), {})[1]

	const [sorting, setSorting] = React.useState([])

	const columns = React.useMemo(
		() => [
			{
				accessorKey: "id",
				header: "ID",
				size: 60
			},
			{
				accessorKey: "firstName",
				cell: info => info.getValue()
			},
			{
				accessorFn: row => row.lastName,
				id: "lastName",
				cell: info => info.getValue(),
				header: () => <span>Last Name</span>
			},
			{
				accessorKey: "age",
				header: () => "Age",
				size: 50
			},
			{
				accessorKey: "visits",
				header: () => <span>Visits</span>,
				size: 50
			},
			{
				accessorKey: "status",
				header: "Status"
			},
			{
				accessorKey: "progress",
				header: "Profile Progress",
				size: 80
			},
			{
				accessorKey: "createdAt",
				header: "Created At",
				cell: info => info.getValue().toLocaleString()
			}
		],
		[]
	)

	const [data, setData] = React.useState(() => makeData(10_000))
	const refreshData = () => setData(() => makeData(10_000))

	const reorderRow = (draggedRowIndex, targetRowIndex) => {
		data.splice(targetRowIndex, 0, data.splice(draggedRowIndex, 1)[0]);
		setData([...data]);
	  };

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getRowId: (row) => row.id,
		debugTable: true,
		debugHeaders: true,
		debugColumns: true,
	})

	const tableContainerRef = React.useRef(null)

	const { rows } = table.getRowModel()
	const rowVirtualizer = useVirtual({
		parentRef: tableContainerRef,
		size: rows.length,
		overscan: 10
	})
	const { virtualItems: virtualRows, totalSize } = rowVirtualizer

	const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
	const paddingBottom =
		virtualRows.length > 0
			? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
			: 0

	return (
		<div className="p-2">
			<div className="h-2" />
			<div ref={tableContainerRef} className="container">
				<table>
					<thead>
						{table.getHeaderGroups().map(headerGroup => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map(header => {
									return (
										<th
											key={header.id}
											colSpan={header.colSpan}
											style={{ width: header.getSize() }}
										>
											{header.isPlaceholder ? null : (
												<div
													{...{
														className: header.column.getCanSort()
															? "cursor-pointer select-none"
															: "",
														onClick: header.column.getToggleSortingHandler()
													}}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
													{{
														asc: " 🔼",
														desc: " 🔽"
													}[header.column.getIsSorted()] ?? null}
												</div>
											)}
										</th>
									)
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{paddingTop > 0 && (
							<tr>
								<td style={{ height: `${paddingTop}px` }} />
							</tr>
						)}
						{virtualRows.map(virtualRow => {
							const row = rows[virtualRow.index]
							return (
								<DraggableRow key={row.id} row={row} reorderRow={reorderRow} />

							)
						})}
						{paddingBottom > 0 && (
							<tr>
								<td style={{ height: `${paddingBottom}px` }} />
							</tr>
						)}
					</tbody>
				</table>
			</div>
			<div>{table.getRowModel().rows.length} Rows</div>
			<div>
				<button onClick={() => rerender()}>Force Rerender</button>
			</div>
			<div>
				<button onClick={() => refreshData()}>Refresh Data</button>
			</div>
		</div>
	)
}

const rootElement = document.getElementById("root")

if (!rootElement) throw new Error("Failed to find the root element")

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<DndProvider backend={HTML5Backend}>
			<App />
		</DndProvider>
	</React.StrictMode>
)
