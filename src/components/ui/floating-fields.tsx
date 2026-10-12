"use client";
import { useState } from "react";
import {
  TextInput as MantineTextInput,
  Textarea as MantineTextarea,
  Select as MantineSelect,
  PasswordInput as MantinePasswordInput,
  type TextInputProps,
  type TextareaProps,
  type SelectProps,
  type PasswordInputProps,
} from "@mantine/core";
const classNames = {
  root: "floating-root",
  label: "floating-label",
  wrapper: "floating-input-shell",
  input: "floating-control",
};
function useFloating(value: unknown) {
  const [focused, setFocused] = useState(false);
  return {
    focused,
    setFocused,
    filled: value !== undefined && value !== null && String(value).length > 0,
  };
}
export function TextInput(props: TextInputProps) {
  const state = useFloating(props.value ?? props.defaultValue);
  if (!props.label) return <MantineTextInput {...props} />;
  return (
    <div
      className="floating-field"
      data-focused={state.focused || undefined}
      data-filled={state.filled || undefined}
    >
      <MantineTextInput
        {...props}
        classNames={classNames}
        placeholder={state.focused ? props.placeholder : " "}
        onFocus={(e) => {
          state.setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          state.setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}
export function Textarea(props: TextareaProps) {
  const state = useFloating(props.value ?? props.defaultValue);
  if (!props.label) return <MantineTextarea {...props} />;
  return (
    <div
      className="floating-field floating-multiline"
      data-focused={state.focused || undefined}
      data-filled={state.filled || undefined}
    >
      <MantineTextarea
        {...props}
        classNames={classNames}
        placeholder={state.focused ? props.placeholder : " "}
        onFocus={(e) => {
          state.setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          state.setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}
export function Select(props: SelectProps) {
  const state = useFloating(props.value ?? props.defaultValue);
  if (!props.label) return <MantineSelect {...props} />;
  return (
    <div
      className="floating-field"
      data-focused={state.focused || undefined}
      data-filled={state.filled || undefined}
    >
      <MantineSelect
        {...props}
        classNames={classNames}
        placeholder={state.focused ? props.placeholder : " "}
        onFocus={(e) => {
          state.setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          state.setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}
export function PasswordInput(props: PasswordInputProps) {
  const state = useFloating(props.value ?? props.defaultValue);
  if (!props.label) return <MantinePasswordInput {...props} />;
  return (
    <div
      className="floating-field"
      data-focused={state.focused || undefined}
      data-filled={state.filled || undefined}
    >
      <MantinePasswordInput
        {...props}
        classNames={{ ...classNames, innerInput: "floating-password-input" }}
        placeholder={state.focused ? props.placeholder : " "}
        onFocus={(e) => {
          state.setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          state.setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}
