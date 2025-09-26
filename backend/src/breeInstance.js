import Bree from "bree";
import path from "path";

const bree = new Bree({
  root: false, // point to your jobs folder
  jobs: [] // we'll add dynamically
});

export default bree;
