declare module 'react-datepicker' {
  import React from 'react';
  
  export interface ReactDatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null, event: React.SyntheticEvent<any> | undefined) => void;
    selectsStart?: boolean;
    selectsEnd?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: string | string[];
    className?: string;
    [key: string]: any;
  }

  const DatePicker: React.FC<ReactDatePickerProps>;
  
  export default DatePicker;
} 