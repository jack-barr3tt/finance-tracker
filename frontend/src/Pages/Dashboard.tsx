import { Table, TableHead, TableHeadCell, TableRow } from "flowbite-react"

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8 px-16">
      <h2 className="text-2xl font-medium">Dashboard</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell>Date</TableHeadCell>
            <TableHeadCell>Account</TableHeadCell>
            <TableHeadCell>Category</TableHeadCell>
            <TableHeadCell>Description</TableHeadCell>
            <TableHeadCell>In</TableHeadCell>
            <TableHeadCell>Out</TableHeadCell>
          </TableRow>
        </TableHead>
      </Table>
    </div>
  )
}
