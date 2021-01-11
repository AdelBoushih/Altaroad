import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

enum orientations {
  North = 'N',
  Est = 'E',
  West = 'W',
  South = 'S',
}
enum directions {
  Droite = 'D',
  Gauche = 'G',
}
interface TondeuseList {
  x: number;
  y: number;
  orientation: string;
  instruction?: string;
}
@Component({
  selector: 'grille',
  templateUrl: './grille.component.html',
  styleUrls: ['./grille.component.css'],
})
export class GrilleComponent implements OnInit {
  @ViewChild('table') table?: ElementRef;
  @ViewChild('target') private myScrollContainer?: ElementRef;

  gridX: number = 10;
  gridY: number = 10;
  speed: number = 350;

  initialGridX: number = 10;
  initialGridY: number = 10;

  errorMessage: string = '';
  toastMessage: string = '';
  error: boolean = false;
  gameStarted: boolean = false;
  tondeuseList: TondeuseList[] = [];
  orderForm: FormGroup;
  items: FormArray;
  constructor(
    private renderer: Renderer2,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {}
  ngOnInit() {
    this.orderForm = this.formBuilder.group({
      items: this.formBuilder.array([this.createItem()]),
    });
  }
  createItem(): FormGroup {
    return this.formBuilder.group({
      x: 0,
      y: 0,
      orientation: 'N',
      instruction: '',
    });
  }

  addItem(): void {
    if (this.orderForm) {
      this.items = this.orderForm.get('items') as FormArray;
      this.items.push(this.createItem());
    }
  }
  rotate(d: directions, item: number) {
    let currentOrientation = this.getOrientation(item);
    if (d == directions.Droite) {
      switch (currentOrientation) {
        case orientations.North: {
          currentOrientation = orientations.Est;
          break;
        }
        case orientations.Est: {
          currentOrientation = orientations.South;
          break;
        }
        case orientations.South: {
          currentOrientation = orientations.West;
          break;
        }
        case orientations.West: {
          currentOrientation = orientations.North;
          break;
        }
      }
    } else
      switch (currentOrientation) {
        case orientations.North: {
          currentOrientation = orientations.West;
          break;
        }
        case orientations.Est: {
          currentOrientation = orientations.North;
          break;
        }
        case orientations.South: {
          currentOrientation = orientations.Est;
          break;
        }
        case orientations.West: {
          currentOrientation = orientations.South;
          break;
        }
      }
    this.updateOrientation(item, currentOrientation);
  }
  getOrientation(item: number): string {
    if (this.tondeuseList[item]) return this.tondeuseList[item].orientation;
    return 'N';
  }
  updateOrientation(item: number, orientation: string) {
    this.tondeuseList[item].orientation = orientation;
  }
  move(item: number) {
    this.handleVisualisation('remove', item);
    switch (this.getOrientation(item)) {
      case orientations.North: {
        if (this.getTondeuseY(item) < this.gridY - 1)
          this.updateTondeuseY(item, 1);
        else
          this.showtoast(
            this.getTondeuseX(item),
            this.getTondeuseY(item) + 1,
            item
          );
        break;
      }
      case orientations.Est: {
        if (this.getTondeuseX(item) < this.gridX - 1)
          this.updateTondeuseX(item, 1);
        else
          this.showtoast(
            this.getTondeuseX(item) + 1,
            this.getTondeuseY(item),
            item
          );
        break;
      }
      case orientations.South: {
        if (this.getTondeuseY(item) > 0) this.updateTondeuseY(item, -1);
        else
          this.showtoast(
            this.getTondeuseX(item),
            this.getTondeuseY(item) - 1,
            item
          );
        break;
      }
      case orientations.West: {
        if (this.getTondeuseX(item) > 0) this.updateTondeuseX(item, -1);
        else
          this.showtoast(
            this.getTondeuseX(item) - 1,
            this.getTondeuseY(item),
            item
          );
        break;
      }
    }
    this.handleVisualisation('add', item);
  }
  getTondeuseX(item: number): number {
    if (this.tondeuseList[item]) return this.tondeuseList[item].x;
    return 0;
  }
  getTondeuseY(item: number): number {
    if (this.tondeuseList[item]) return this.tondeuseList[item].y;
    return 0;
  }
  updateTondeuseX(item: number, move: number) {
    if (this.tondeuseList[item]) this.tondeuseList[item].x += move;
  }
  updateTondeuseY(item: number, move: number) {
    if (this.tondeuseList[item]) this.tondeuseList[item].y += move;
  }
  handleActions(i: string, item: number) {
    if (i == 'D' || i == 'd') this.rotate(directions.Droite, item);
    else if (i == 'G' || i == 'g') this.rotate(directions.Gauche, item);
    else if (i == 'A' || i == 'a') this.move(item);
    else this.showtoast(0, 0, item, i);
    // console.log(this.x, this.y, this.orientation);
  }

  async parseInstuctions(instruction: string, item: number) {
    (function myLoop(i, self: any) {
      setTimeout(function () {
        self.handleActions(instruction[instruction.length - i], item);
        if (--i) myLoop(i, self);
      }, self.speed);
    })(instruction.length, this);
    return new Promise((resolve) => {
      setTimeout(
        resolve,
        (parseInt(this.speed + '') + 50) * instruction.length
      );
    });
  }
  drawGrid(item: number) {
    console.log('Drawing...');
    if (this.table)
      this.renderer.setProperty(this.table.nativeElement, 'innerHTML', '');
    const tbody = this.renderer.createElement('tbody');
    for (let i = 0; i < this.gridY; i++) {
      const tr = this.renderer.createElement('tr');
      for (let j = 0; j < this.gridX; j++) {
        const td = this.renderer.createElement('td');
        this.renderer.setProperty(td, 'id', `${j}-${this.gridY - 1 - i}`);
        this.renderer.appendChild(tr, td);
      }
      this.renderer.appendChild(tbody, tr);
    }

    if (this.table) this.renderer.appendChild(this.table.nativeElement, tbody);
  }

  handleVisualisation(action: string, item: number) {
    // console.log(this.tondeuseList);
    var element = document.getElementById(
      `${this.getTondeuseX(item)}-${this.getTondeuseY(item)}`
    );
    if (element)
      if (action == 'add') {
        // element.classList.add('active');
        element.classList.add('item-' + item);
      } else {
        // element.classList.remove('active');
        element.classList.remove('item-' + item);
      }
  }

  throwError(message: string) {
    this.errorMessage = message;
    // this.error = true;
    if (this.table)
      this.table.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  showtoast(x: number, y: number, item: number, i: string = '') {
    if (i != '')
      this.toastMessage = `L'instruction '${i}' est invalide, passage à l'instruction suivante.  `;
    else
      this.toastMessage = `La postion (${x} , ${y}) est hors grille, passage à l'instruction suivante.  `;

    this.toastr.info(
      this.toastMessage,
      'Tondeuse ' + (item + 1) + ' Instruction invalide!'
    );
    // let toast = document.getElementById('toast');
    // if (toast) {
    //   toast.style.display = 'block';
    // }
  }

  closeToast() {
    this.toastMessage = ``;
    let toast = document.getElementById('toast');
    if (toast) {
      toast.style.display = 'none';
    }
  }
  checkInput(tondeuse: TondeuseList): boolean {
    if (tondeuse.instruction == '') {
      this.throwError("La liste d'instructions fournie est vide!");
      return false;
    }
    if (tondeuse.x >= this.gridX) {
      this.throwError('Coordonnée X invalide');
      return false;
    }

    if (tondeuse.y >= this.gridY) {
      this.throwError('Coordonnée Y invalide');
      return false;
    }

    if (tondeuse.x < 0 || tondeuse.y < 0 || this.gridX < 0 || this.gridY < 0) {
      this.throwError('Coordonnées invalides');
      return false;
    }
    return true;
  }
  start() {
    if (!this.gameStarted) {
      if (this.table)
        this.renderer.setProperty(this.table.nativeElement, 'innerHTML', '');

      this.gridX = this.initialGridX + 1;
      this.gridY = this.initialGridY + 1;

      this.closeToast();
      this.error = false;

      setTimeout(() => {
        if (this.table)
          this.table.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      let check = true;
      let elements = this.formData.getRawValue();
      for (let i = 0; i < elements.length; i++) {
        this.tondeuseList[i] = {
          x: elements[i].x,
          y: elements[i].y,
          orientation: elements[i].orientation,
          instruction: elements[i].instruction,
        };
        if (!this.checkInput(elements[i])) {
          check = false;
          this.toastr.warning(this.errorMessage, 'Erreur Tondeuse ' + (i + 1));
        }
      }

      if (check) {
        this.gameStarted = true;
        this.drawGrid(0);
        let i = 0;
        setTimeout(async () => {
          do {
            this.handleVisualisation('add', i);
            await this.parseInstuctions(elements[i].instruction, i);
            i++;
          } while (i < elements.length);
          this.gameStarted = false;
        }, 1000);
      }
    }
  }

  get formData() {
    return <FormArray>this.orderForm.get('items');
  }
}
