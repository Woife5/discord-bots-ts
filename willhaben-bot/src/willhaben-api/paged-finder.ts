import { WillhabenResult } from "./types";
import willhaben from "willhaben";

type Optional<T> = T | null | undefined;

export class PagedFinder {
    public page = 0;
    public pages = 0;

    private results: WillhabenResult[] = [];

    constructor(public PAGE_SIZE = 5, public PAGE_AMOUNT = 5) {}

    public async find(keyword: string, category: Optional<string>) {
        const w = willhaben
            .new()
            .keyword(keyword)
            .count(this.PAGE_SIZE * this.PAGE_AMOUNT);
        if (category) {
            w.category(willhaben.getCategories[category]);
        }

        this.results = await w.search();
        const maxIndex = this.results.length - 1;
        this.pages = Math.ceil(maxIndex / this.PAGE_SIZE);
    }

    public hasNextPage(): boolean {
        return this.page < this.pages;
    }

    public hasPrevPage(): boolean {
        return this.page > 1;
    }

    public nextPage(): WillhabenResult[] {
        if (this.page < this.pages) {
            this.page += 1;
        }

        return this.getPage(this.page);
    }

    public prevPage(): WillhabenResult[] {
        if (this.page > 1) {
            this.page -= 1;
        }

        return this.getPage(this.page);
    }

    public getCurrentPage(): WillhabenResult[] {
        return this.getPage(this.page);
    }

    public getPage(page: number): WillhabenResult[] {
        const startIndex = (page - 1) * this.PAGE_SIZE;
        let endIndex = startIndex + this.PAGE_SIZE - 1;

        if (startIndex > this.results.length - 1) {
            return [];
        }

        if (endIndex > this.results.length - 1) {
            endIndex = this.results.length - 1;
        }

        return this.results.slice(startIndex, endIndex);
    }
}
