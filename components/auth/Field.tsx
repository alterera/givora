import type { ComponentProps, ReactNode } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

type Props = Omit<ComponentProps<'input'>, 'id'> & {
  id: string
  label: string
  icon?: ReactNode
  /** Small content on the right of the label row (e.g. "Forgot password?"). */
  aside?: ReactNode
  optional?: boolean
}

/** Labelled input with a leading icon. Text stays 16px so iOS Safari never zooms on focus. */
export default function Field({ id, label, icon, aside, optional, className, ...input }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label" htmlFor={id}>
          {label} {optional ? <span className="text-[#6b6b6b]">(optional)</span> : input.required ? <span className="text-[var(--g)]">*</span> : null}
        </label>
        {aside}
      </div>
      <InputGroup className="h-11 rounded-[2px] border-[var(--line)] bg-black transition-shadow has-[[data-slot=input-group-control]:focus-visible]:border-[var(--g)] has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-[rgba(25,255,160,.14)]">
        {icon && <InputGroupAddon align="inline-start" className="text-[#6b6b6b]">{icon}</InputGroupAddon>}
        <InputGroupInput id={id} className={`h-full text-base md:text-base ${className ?? ''}`} {...input} />
      </InputGroup>
    </div>
  )
}
