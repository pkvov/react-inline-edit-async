import * as React from 'react'
import { useEffect, useRef } from 'react'
import { useMachine } from '@xstate/react'
import getInlineEditMachine from './machine'
import Input from './Input'
import InputType from './inputType'

interface InlineEditProps {
  value: string
  onChange: (value: string) => void
  type?: InputType
  format?: (value: string) => string
  render?: (value: string) => React.ReactElement
  validate?: (value: string) => boolean
  isDisabled?: boolean
  allowEditWhileLoading?: boolean
  optimisticUpdate?: boolean
  saveTimeout?: number
  savedDuration?: number
  errorDuration?: number
  editProps?: {
    [key: string]: any
  }
  viewClass?: string
  editClass?: string
  disabledClass?: string
  loadingClass?: string
  invalidClass?: string
  savedClass?: string
  errorClass?: string
  showNewLines?: boolean
  options?: any[]
  valueKey?: string
  labelKey?: string
  disableClick?: boolean
}

const InlineEdit: React.FC<InlineEditProps> = React.forwardRef(({
  value,
  onChange,
  type = InputType.Text,
  format,
  render,
  validate,
  isDisabled = false,
  allowEditWhileLoading = false,
  optimisticUpdate = true,
  saveTimeout = 2000,
  savedDuration = 700,
  errorDuration = 1000,
  editProps,
  viewClass,
  editClass,
  disabledClass,
  loadingClass,
  invalidClass,
  savedClass,
  errorClass,
  showNewLines = true,
  options = [],
  valueKey = 'value',
  labelKey = 'label',
  disableClick = false,
}, ref) => {
  //==========================
  // XState Machine
  // =========================
  const [current, send] = useMachine(
    getInlineEditMachine({
      value,
      isDisabled,
      allowEditWhileLoading,
      optimisticUpdate,
      validate,
      onChange,
      saveTimeout,
      savedDuration,
      errorDuration,
    })
  )

  //==========================
  // Send SAVED event when a
  // new value is received
  // =========================
  const isFirstRun = useRef(true)

  useEffect(() => {
    // Prevent triggering SAVED
    // on first render
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    // Trigger it on value changes
    send({ type: 'SAVED', value })
  }, [value])

  //==========================
  // Event Handlers
  // =========================

  const handleChange = (value: any) => {
    send({ type: 'CHANGE', value: value })
    if (type === InputType.Select) {
      send('ENTER')
    }
  }

  const handleBlur = () => {
    send('BLUR')
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.keyCode === 13 && type !== InputType.TextArea) {
      send('ENTER')
    } else if (event.keyCode === 27) {
      send('ESC')
    }
  }

  React.useImperativeHandle(ref, () => ({
    sendClick() {
      send('CLICK');
    },
    getCurrentState() {
      return current.value;
    }
  }));

  //==========================
  // CSS Classes View
  // =========================
  let viewClassNames = []
  if (viewClass) {
    viewClassNames.push(viewClass)
  }
  if (loadingClass && current.value === 'loading') {
    viewClassNames.push(loadingClass)
  }
  if (savedClass && current.value === 'saved') {
    viewClassNames.push(savedClass)
  }
  if (errorClass && current.value === 'error') {
    viewClassNames.push(errorClass)
  }
  if (disabledClass && isDisabled) {
    viewClassNames.push(disabledClass)
  }
  const viewClassProp =
    viewClassNames.length > 0 ? { className: viewClassNames.join(' ') } : {}

  //==========================
  // CSS Classes Edit
  // =========================
  let editClassNames = []
  if (editClass) {
    editClassNames.push(editClass)
  }
  if (invalidClass && !current.context.isValid) {
    editClassNames.push(invalidClass)
  }
  const editClassProp =
    editClassNames.length > 0 ? { className: editClassNames.join(' ') } : {}

  //==========================
  // Format View Value
  // =========================
  let viewValue: any = current.context.value

  // If Select => get label
  if (type === InputType.Select) {
    const valueOption = options.find(
      (option: any) => option[valueKey] + '' === current.context.value
    )

    if (valueOption) {
      viewValue = valueOption[labelKey]
    }
  }

  // If format function, apply
  if (format) {
    viewValue = format(viewValue)
  }

  // If TextArea and showNewLine, do it
  if (type === InputType.TextArea && showNewLines) {
    viewValue = viewValue.split('\n').map((item: string, key: number) => {
      return (
        <span key={key}>
          {item}
          <br />
        </span>
      )
    })
  }

  //==========================
  // Render
  // =========================
  return (
    <>
      {(current.value === 'view' ||
        current.value === 'loading' ||
        current.value === 'saved' ||
        current.value === 'error') && (
          <span
            {...viewClassProp}
            onClick={() => {
              if (!disableClick) {
                send('CLICK')
              }
            }
            }
            onFocus={() => send('FOCUS')}
            tabIndex={0}
          >
            {render ? render(viewValue) : viewValue}
          </span>
        )}
      {current.value === 'edit' && (
        <Input
          type={type}
          value={current.context.newValue}
          editProps={editProps}
          editClassProp={editClassProp}
          options={options}
          valueKey={valueKey}
          labelKey={labelKey}
          handleChange={handleChange}
          handleKeyDown={handleKeyDown}
          handleBlur={handleBlur}
        />
      )}
    </>
  )
})

export default InlineEdit
