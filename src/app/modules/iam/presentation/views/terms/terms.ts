import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
  selector: 'app-terms',
  imports: [RouterLink, MatIcon, TranslatePipe, LanguageSwitcher],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
})
export class Terms {}
