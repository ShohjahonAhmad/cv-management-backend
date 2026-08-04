import { Dropbox } from "dropbox";

const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN!;

const dbx = new Dropbox({accessToken: DROPBOX_ACCESS_TOKEN})

export default dbx;