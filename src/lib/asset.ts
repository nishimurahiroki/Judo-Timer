import { addBasePath } from "next/dist/client/add-base-path";

export const asset = (path: string) => addBasePath(path);


