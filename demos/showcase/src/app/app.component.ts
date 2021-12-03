import { Component } from "@angular/core";

import { Loop } from "@electric/ng-utils";
import { Fn } from "@electric/utils";

@Component({
	selector: "elx-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	timer?: Timer;

	blocking = false;
	nonBlocking = false;
	warning = false;
	indeterminate = false;

	log(message: string): void {
		console.log(message);
	}

	startTimer(seconds: number) {
		this.timer = new Timer(this.stopTimer, seconds);
	}

	stopTimer = () => {
		this.timer?.cancel();
		this.timer = undefined;
	}
}

class Timer {
	get total() { return this._seconds; }
	get current() { return this._current; }

	private _current = 0;
	private _cancelled = false;

	constructor (
		private onComplete: Fn,
		private _seconds: number,
	) {
		this.tick();
	}

	cancel() {
		this._cancelled = true;
	}

	@Loop()
	private tick(deltaTime = 0): void | false {
		if (this._cancelled) {
			return false;
		}

		this._current += deltaTime;
		if (this.current >= this.total) {
			this.onComplete();

			return false;
		}
	}
}
