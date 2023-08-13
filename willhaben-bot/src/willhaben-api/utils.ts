import willhaben from "willhaben";

export function isCategory(category: string): boolean {
    return !!willhaben.getCategories[category];
}
