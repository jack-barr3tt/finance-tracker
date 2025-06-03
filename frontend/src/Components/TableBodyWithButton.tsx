import { TableBody, TableBodyProps } from "flowbite-react"
import { ReactNode } from "react"

type TableBodyWithButtonProps = TableBodyProps & {
  button?: ReactNode
}

export default function TableBodyWithButton(props: TableBodyWithButtonProps) {
  const { button, children, className, ...rest } = props
  return (
    <TableBody className={`${className ?? ""} relative group`} {...rest}>
      {children}
      <div className="absolute bottom-0 flex items-center justify-center w-0 h-0 left-1/2">
        <div className="transition-all scale-0 duration-0 group-hover:scale-100">{button}</div>
      </div>
    </TableBody>
  )
}
