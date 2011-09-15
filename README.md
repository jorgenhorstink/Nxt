The last couple of years I've been developing on the server-side based on the principles of Domain Driven Design (DDD) by Eric Evans [1]. More recently I started learning the Javascript language. The user interface of the application I am working on now is written in Javascript, and uses a RESTful JSON architecture for communication with the server.

One of the big challenges of designing such an application in Javascript is keeping the different UI components up to date. The [Backbone.js](http://documentcloud.github.com/backbone/ "Backbone.js") library explains:

> When working on a web application that involves a lot of JavaScript, one of the first things you learn is to stop tying your data to the DOM. It's all too easy to create JavaScript applications that end up as tangled piles of jQuery selectors and callbacks, all trying frantically to keep data in sync between the HTML UI, your JavaScript logic, and the database on your server. For rich client-side applications, a more structured approach is often helpful.

While I was learning the Backbone.js framework, I was troubled with the fact that there is tight coupling between the Model and the View. As I understand it right now, a Model in the Backbone.js Framework is just a data structure, a bag with properties and not a Domain Model in the DDD perspective.

This triggered me to create on my own Domain Driven Design Event Driven User Interface Framework in Javascript (I admit, this description is insane...).

## Nxt

Nxt is meant to be a Framework where the programmer is forced to focus on the Domain Model. The Domain Model is the heart of the application and different user interface components listen to changes in the Domain Model.

I'll use an example to try to explain these abstract words. Let say we would like to make a small todo tool with just two buttons; one to add a new item to a list (item 1, item 2, ...), and one button to reverse the list order. The first step we have to take, is designing the Domain Model that meets these requirements.

```javascript
    var TodoList = Nxt.extend({
        constructor : function () {
            this.clear();   
        },
        add : function (item) {
            this.tasks.push(item);
        },
        clear : function () {
            this.tasks = [];  
        },
        length : function () {
            return this.tasks.length;
        },
        getTasks : function () {
            return this.tasks;   
        },
        reverse : function () {
            this.tasks = this.tasks.reverse();
        }
    });

    var TodoTask = Nxt.extend({
        constructor : function (description, done) {
            this.description = description;
            this.done  = done;
        },
        getDescription : function () {
            return this.description; // Just a string containing the task description
        },
        markAsDone : function () {
            this.done = true;
        },
        isDone : function () {
            return this.done;
        }
    });
```

The example above creates a very basic Domain Model. One could easily extend the `TodoList` with a method for marking all tasks as done by iterating over the tasks in the list and calling the `markAsDone` method on each `task`.

The next step is creating the user interface components; two buttons and a list. For the moment I use the excellent jQuery framework for working with the DOM.
    
```javascript
    var TodoView = NxtView.extend({
        element : $('body'), // append to the body
        events : {
            add : 'renderTask', // call this method when a task is added to the TodoList Model
            reverse : 'render' // rerender the entire list
        },
        // when calling the TodoView constructor, the list is automatically rendered
        render : function () {
            if (this.list === undefined) { // no list yet? create one
                this.list = $('<ul>');
                this.element.append(this.list);
            }
            var self = this;
            this.list.html(''); // every time the list is completely (re)rendered, clear it first

            // the view iterates over the tasks in the TodoList Model and renders the task
            $.each(this.properties.model.getTasks(), function (index, task) {
                self.renderTask(task);
            });
        },
        // will be called when the list is (re)rendered, or when a todoList.add(new TodoTask('boehoe'))
        // method is called. This actually updates the UI.
        renderTask : function (task) {
            this.list.append($('<li>').html(task.getDescription()));
        }
    });

    // Create a simple button with jQuery and append it to the body element
    // When the button is clicked, it will simply add a new task to the model
    // The TodoView instance object is coupled to the same model, and will
    // be notified of the newly added task and will update the UI accordingly :)
    var AddButtonView = NxtView.extend({
        element : $('body'),
        render : function () {
            var model = this.properties.model;
            this.button = $('<button>')
                .html('Add task')
                .click(function () {
                    model.add(new TodoTask('Task #' + (model.length() + 1)));
                })
            ;
            this.element.append(this.button);
        }
    });
    
    // I don't like to repeat myself, so read the comment on the previous button.
    // This button just reverses the order of tasks in the Domain Model, and the
    // TodoView instance will be notified and will update the UI accordingly.
    var ReverseButtonView = NxtView.extend({
        element : $('body'),
        render : function () {
            var model = this.properties.model;
            this.button = $('<button>')
                .html('Reverse list')
                .click(function () {
                    model.reverse();
                })
            ;
            this.element.append(this.button);   
        }
    });
```

Domain Model classes: check! View classes: check! The last step now is instantiating the classes we just created. Remember: instantiated View components will immediately be rendered.

```javascript
    var list = new TodoList();
    list.add(new TodoTask('Just some tasks'));
    list.add(new TodoTask('We would like to start with'));
    
    // bind the TodoList to the add button
    var addButtonView = new AddButtonView({ 'model' : list });
    // bind the TodoList to the reverse button
    var reverseButtonView = new ReverseButtonView({ 'model' : list });
    
    // Last but not least: bind the TodoList to the listView component
    var listView = new ListView({ 'model' : list });
```

## Conclusion
If you read this, I am quite exited. It means you actually took the time to read it. Thank you very much! This is still work in progress, but if you've comments on my core concepts right now, I'd love to hear it!

-cheers,
Jorgen

## References
[1] Eric Evans (2003), Domain Driven Design, http://domaindrivendesign.org/books/evans_2003