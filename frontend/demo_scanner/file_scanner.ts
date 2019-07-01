import * as fs from 'fs';
import * as md5File from 'md5-file'
import * as path from 'path'


export default class FileScanner {
    directory: string;
    demoFiles: DemoFile[];
    stateFilename: string;

    constructor(directory: string) {
        this.directory = directory;
        this.stateFilename = 'state.json'

        try {
            this.demoFiles = this.readStateFromFile()
        } catch {
            this.demoFiles = []
        }
    }

    loadDemofiles() {
        return fs.readdirSync(this.directory).sort().map(file => {
            let demo = new DemoFile(file, path.join(this.directory, file));
            return demo
        })
    }

    saveStateToFile() {
        return fs.writeFileSync(this.stateFilename, JSON.stringify(this.demoFiles))
    }

    readStateFromFile() {
        return JSON.parse(fs.readFileSync(this.stateFilename).toString()).map(data => {
            let demo = new DemoFile(data.filename, data.filepath, data.md5)
            return demo
        })
    }

    nextDemoToParse() {
        let loadedDemoFiles = this.loadDemofiles();
        for (var i = 0; i < loadedDemoFiles.length; ++i) {
            let demoFile = loadedDemoFiles[i];
            let foundDemo = this.demoFiles.find(demo => demo.filename == demoFile.filename)

            if(!foundDemo) {
                let newDemo = new DemoFile(demoFile.filename, demoFile.filepath, demoFile.md5)
                this.demoFiles.push(newDemo)
                return newDemo
            } else if(foundDemo && foundDemo.md5 != demoFile.md5) {
                foundDemo.setMd5()
                return foundDemo
            }
        }
    }
}


class DemoFile {
    filename: string;
    filepath: string;
    md5: string;
    id: string;

    constructor(filename: string, filepath: string, md5?: string) {
        this.filename = filename;
        this.filepath = filepath;
        let filenameParts = this.filename.split('-')
        this.id = [filenameParts[1], filenameParts[2], filenameParts[3]].join('')
        if(md5) {
            this.md5 = md5
        } else {
            this.setMd5()
        }
    }

    setMd5() {
        this.md5 = md5File.sync(this.filepath);
    }
}
