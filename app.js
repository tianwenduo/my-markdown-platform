class MarkdownEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.filename = document.getElementById('filename');
        this.status = document.getElementById('status');
        this.fileInput = document.getElementById('file-input');
        this.downloadLink = document.getElementById('download-link');
        
        this.currentFile = null;
        this.initialContent = '';
        
        this.initEventListeners();
        this.updatePreview();
    }
    
    initEventListeners() {
        this.editor.addEventListener('input', () => {
            this.updatePreview();
            this.setStatus('unsaved');
        });
        
        document.getElementById('new-file').addEventListener('click', () => this.newFile());
        document.getElementById('open-file').addEventListener('click', () => this.openFile());
        document.getElementById('save-file').addEventListener('click', () => this.saveFile());
        document.getElementById('rename-file').addEventListener('click', () => this.renameFile());
        document.getElementById('save-as').addEventListener('click', () => this.saveAs());
        
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，确定要离开吗？';
                return e.returnValue;
            }
        });
    }
    
    updatePreview() {
        const markdown = this.editor.value;
        const html = marked.parse(markdown);
        this.preview.innerHTML = html;
    }
    
    setStatus(status) {
        this.status.textContent = status === 'saved' ? '已保存' : '未保存';
        this.status.className = status;
    }
    
    hasUnsavedChanges() {
        return this.editor.value !== this.initialContent;
    }
    
    newFile() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('您有未保存的更改，确定要新建文件吗？')) {
                return;
            }
        }
        
        this.editor.value = '';
        this.currentFile = null;
        this.initialContent = '';
        this.filename.textContent = '未命名.md';
        this.setStatus('saved');
        this.updatePreview();
    }
    
    openFile() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('您有未保存的更改，确定要打开新文件吗？')) {
                return;
            }
        }
        
        this.fileInput.click();
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.editor.value = e.target.result;
            this.currentFile = file;
            this.initialContent = e.target.result;
            this.filename.textContent = file.name;
            this.setStatus('saved');
            this.updatePreview();
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }
    
    saveFile() {
        if (this.currentFile) {
            this.saveToFile(this.currentFile);
        } else {
            this.saveAs();
        }
    }
    
    saveAs() {
        const content = this.editor.value;
        const filename = this.filename.textContent;
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        this.downloadLink.href = url;
        this.downloadLink.download = filename;
        this.downloadLink.click();
        
        URL.revokeObjectURL(url);
    }
    
    renameFile() {
        const currentName = this.filename.textContent;
        const baseName = currentName.replace(/\.md$/, '');
        
        const newName = prompt('请输入新的文件名（不需要加 .md 扩展名）：', baseName);
        
        if (newName === null) {
            return;
        }
        
        if (newName.trim() === '') {
            alert('文件名不能为空！');
            return;
        }
        
        const finalName = newName.trim().endsWith('.md') ? newName.trim() : newName.trim() + '.md';
        this.filename.textContent = finalName;
        
        if (this.currentFile) {
            if (this.hasUnsavedChanges()) {
                if (confirm('文件有未保存的更改，是否立即保存？')) {
                    this.saveFile();
                }
            }
        }
        
        alert(`文件已重命名为：${finalName}`);
    }
    
    saveToFile(file) {
        const content = this.editor.value;
        
        if (window.showSaveFilePicker) {
            this.saveWithFileSystemAPI(file.name);
        } else {
            this.saveAs();
        }
    }
    
    async saveWithFileSystemAPI(filename) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'Markdown 文件',
                    accept: { 'text/markdown': ['.md'] }
                }]
            });
            
            const writable = await handle.createWritable();
            await writable.write(this.editor.value);
            await writable.close();
            
            this.currentFile = handle;
            this.initialContent = this.editor.value;
            this.filename.textContent = filename;
            this.setStatus('saved');
        } catch (err) {
            console.error('保存失败:', err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});