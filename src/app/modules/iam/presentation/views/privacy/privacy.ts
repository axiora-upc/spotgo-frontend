import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink, MatIcon, TranslatePipe, LanguageSwitcher],
  templateUrl: './privacy.html',
  styleUrl: './privacy.css',
})
export class Privacy {}
