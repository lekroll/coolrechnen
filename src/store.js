import { writable ,readable} from "svelte/store";

export const name = writable('Test');
export const level = writable(10);
export const operations = writable([]);
export const photos = writable([]);
export const alloperations = readable(['+','-',':','x']);
export const alllevels = readable([10,20,50,100]);
export const lastdate = new Date();
export const results = {ok:[],false:[],date: lastdate};

