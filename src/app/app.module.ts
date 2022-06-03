import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SchedulerModule } from '@progress/kendo-angular-scheduler';

import { AppComponent } from './app.component';
import { EditService } from './edit.service';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SchedulerModule,
        HttpClientModule,
        HttpClientJsonpModule
    ],
    declarations: [ AppComponent ],
    bootstrap: [ AppComponent ],
    providers: [ EditService ]
})

export class AppModule { }

