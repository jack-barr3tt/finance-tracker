import { TableBody, TableBodyProps } from "flowbite-react"
import { ReactNode } from "react"

type TableBodyWithButtonProps = TableBodyProps & {
  button?: ReactNode
}

export default function TableBodyWithButton(props: TableBodyWithButtonProps) {
  const { button, children, className, ...rest } = props
  return (
    <TableBody className={`${className ?? ""} relative group/tablebody`} {...rest}>
      {children}
      <div className="absolute top-0 left-1/2 z-20 flex h-0 w-0 items-center justify-center">
        <div className="transition-all scale-0 duration-0 group-hover/tablebody:scale-100">{button}</div>
      </div>
    </TableBody>
  )
}
