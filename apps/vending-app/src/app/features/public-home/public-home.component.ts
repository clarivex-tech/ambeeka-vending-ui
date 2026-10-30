import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'vpa-public-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-home.component.html',
  styleUrl: './public-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHomeComponent {
  readonly currentYear = new Date().getFullYear();
}
