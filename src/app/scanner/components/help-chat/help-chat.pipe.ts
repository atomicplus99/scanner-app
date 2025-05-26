// src/app/pipes/replace.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replace',
  standalone: true
})
export class ReplacePipe implements PipeTransform {
  transform(value: string, searchValue: string, replaceValue: string): string {
    if (!value || !searchValue || !replaceValue) {
      return value;
    }
    
    // Escapar caracteres especiales en searchValue para RegExp
    const escapeRegExp = (string: string): string => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    const regex = new RegExp(escapeRegExp(searchValue), 'g');
    return value.replace(regex, replaceValue);
  }
}