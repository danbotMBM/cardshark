// Create a WebSocket instance
        // const socket = new WebSocket('ws://danielmarkjones.com:8081/cardshark_server');
        const socket = new WebSocket('ws://localhost:8080');
        const canvas = document.querySelector('canvas')
        const c = canvas.getContext('2d')
        actors = {
            "background": [{"tl":[0,0], "sz":[1,1]}]
        }
        function draw(actors){
            actors.forEach( actor => {
                console.log(actor)
                c.fillStyle = 'black'
                c.fillRect(actor.tl[0], actor.tl[0], 10, 10)
            })
            
        }
        function animate(){
            window.requestAnimationFrame(animate)
            draw(actors["background"]);
        }
        animate()
        
        
        function rooms(rooms){
            put_area = document.getElementById("put_rooms");
            put_area.innerHTML = '';
            console.log(rooms);
            rooms.forEach(element => {
                new_div = document.createElement('div');
                new_div.class = "col-sm-2";
                new_div.style = "margin:15px; border:black;"
                new_div.id = element.id;
                // TODO code injection exploit
                new_div.innerHTML = '<p>'+element.id+'<br>Owner: '+"TODO" + '<br>Players: ' + element.connections+ '<br></p>'
                if (!element.started){
                  new_div.innerHTML += '<button type="button" onclick="join_room(\''+element.id+'\')">join '+element.id+'</button>';
                }
                put_area.appendChild(new_div);
            });
        }

        function create_room() {
            const name = document.getElementById('room_id_input').value;
            // Event listener for when the connection is opened
            socket.send('{"msg":"create_room", "payload":{"room_id":"' + name + '"}}');
        }

        function list_rooms() {
            socket.send('{"msg":"list_rooms"}');
        }

        function join_room(room_id) {
            socket.send('{"msg":"join_room", "payload":{"room_id":"' + room_id + '"}}');
        }

        socket.addEventListener('open', (event) => {
            console.log('WebSocket connection opened:', event);
            socket.send('{"msg":"list_rooms"}');
        });


        // Event listener for when a message is received from the server
        socket.addEventListener('message', (event) => {
            console.log('Message from server:', event.data);
            msg = JSON.parse(event.data);
            if(msg.msg == "rooms"){
                rooms(msg.payload);
            }
            document.getElementById('result2').textContent = event.data;
        });

        // Event listener for when the connection is closed
        socket.addEventListener('close', (event) => {
            console.log('WebSocket connection closed:', event);
        });

        // Event listener for errors
        socket.addEventListener('error', (event) => {
            console.error('WebSocket error:', event);
        });