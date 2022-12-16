import { getNextTime } from "../utils/date.util";

export function runDaily(hour: number, fn: () => void) {
    setTimeout(() => {
        setInterval(() => {
            fn();
        }, 24 * 60 * 60 * 1000);

        fn();
    }, getNextTime(hour).getTime() - Date.now());
}
