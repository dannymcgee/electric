import { QueryList as NgQueryList } from "@angular/core";
import { Observable } from "rxjs";

export interface QueryList<T> extends NgQueryList<T> {
	changes: Observable<QueryList<T>>;
}
