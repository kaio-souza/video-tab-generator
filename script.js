let i, j,
tab = [
    '', '', '','', '', '', 
    'e-3', 'a-2', 'a-3','', 'a-5', 'a-7', 'a-5h7','a-2', 'a-3', 'a-5', 'a-7', 'a-5h7','a-2', 'a-3', 'a-5', 'a-7', 'a-5h7','a-2', 'a-3',
    'e-3', 'a-2', 'a-3','', 'a-5', 'a-7', 'a-5h7','a-2', 'a-3'
],
strings = ['g','d','a','e'], 
g = document.getElementById('g'),
d = document.getElementById('d'),
a = document.getElementById('a'),
e = document.getElementById('e')

for (i = 0 ; i < tab.length ; i++) {
    let currentNote = tab[i].split('-')
    for (j = 0 ; j < strings.length ; j++ ){
        let note = document.createElement("p")

        note.classList.add("note")

        if(currentNote[0] === strings[j]){
            let container = document.createElement("span")
            container.classList.add("note-content")
            container.innerHTML = currentNote[1]
            note.append(container)
        }
        eval(strings[j]).append(note);
    }
}

function play(){
    let strings = document.querySelectorAll('.string');

    strings.forEach(function(string) {
        string.classList.add('run');
    });

    domtoimage.toPng(document.querySelector('.displayer'))
    .then(function (dataUrl) {
        var img = new Image();
        debugger;
        img.src = dataUrl;
        document.body.appendChild(img);
    })
    .catch(function (error) {
        console.error('oops, something went wrong!', error);
    });
}
