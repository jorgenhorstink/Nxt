(function(window, undefined) {

    var Nxt = (function() {

        var _x = window.x;
        var _nxt = window.nxt;

        var merge = function (destination, properties, filter) {
            // The filter argument is optional, if no filter is provided, all values pass the filter and will be merged into the destination object
            filter = filter || function () { return true; };
            
            if (destination && properties && typeof properties === 'object') {
                for (var property in properties) {
                    if (filter(property, destination, properties) && properties[property] !== undefined) {
                        destination[property] = properties[property];
                    }
                }
            }
            
            return destination;
        }
        
        var override = function (destination, properties) {
            return merge(destination.prototype, properties);   
        }
        
        var ensure = function (o, config) {
            if (config instanceof o === false) {
                config = new o(config);   
            }
            return config;
        }
        
        // Nxt root constructor
        var Nxt = function () {};
        Nxt.merge = merge;
        Nxt.ensure = ensure;
        Nxt.extend = function (properties) {
            var superclass = this;
            var subclass = properties.hasOwnProperty('constructor') ? properties.constructor : function () { return superclass.apply(this, arguments); };
                        
            function F() {}
            F.prototype = superclass.prototype;
            subclass.prototype = new F();
            subclass.prototype.constructor = subclass.prototype;

            // when the object is extended, a superclass reference can be called from the subclass to access the superclass.
            override(subclass, merge(properties, { 'superclass' : superclass.prototype }));

            merge(subclass, { 'extend' : superclass.extend });
            
            return subclass;
        }
    
        return Nxt;
    
    })();
    
    window.Nxt = Nxt;
    
})(window);

var NxtView = Nxt.extend({
    constructor : function (properties) {
        
        this.properties = Nxt.merge({
            nodeName : undefined,
            element : undefined
        }, properties);
        
        var model = this.properties.model;
        var element = this.properties.element;
        
        var modelListeners = this.ml() || {};
        var nodeName = this.nodeName || undefined;
        
        if (nodeName !== undefined) {
            this.element = $('<' + nodeName + '>');   
        }
        
        var self = this;
        $.each(modelListeners, function (index, listener) {
            var original = model[index];
            model[index] = function () {
                original.apply(model, arguments);
                listener.apply(self, arguments);
            }
        });
        
        /*
        var self = this;
        $.each(this.events || {}, function (index, event) {
            var original = model[index];
            
            model[index] = function () {
                original.apply(model, arguments); 
                var element = self[event].apply(self, arguments);
                var current = self.element;
                current.replaceWith(element);
                self.element = element;
            }
            
        });
        
        element.append(this.element = this.render(model));
        */
    }
});

(function($) {
    
    $(document).ready(function () {
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
                this.done = done || false;
            },
            getDescription : function () {
                return this.description; // Just a string containing the task description
            },
            toggleDone : function () {
                this.done = !this.done;
            },
            isDone : function () {
                return this.done;
            }
        });
        
        var TaskView = NxtView.extend({
            nodeName : 'li',
            ml : function () {
                return { toggleDone : this.render };
            },
            render : function () {
                var task = this.properties.model, html;
                
                task.isDone() ? this.element.addClass('strike') : this.element.removeClass('strike');
                
                var toggleDone = function () {
                    task.toggleDone;   
                }
                
                this.element.html(task.getDescription()).unbind('click').click(function () {
                    task.toggleDone(); 
                });

                return this;
            }
        });
        
        var TodoView = NxtView.extend({
            nodeName : 'div',
            
            ml : function () { // the model listeners
                return {
                    add : this.renderTask, // call this method when a task is added to the TodoList Model
                    reverse : this.renderTasks // rerender the entire list
                }
            },
            render : function () {
                var todoList = this.properties.model;
                
                this.addButton = $('<button>Add item</button>').click(function () {
                    todoList.add(new TodoTask('Woei'));
                });

                this.reverseButton = $('<button>Reverse</button>').click(function () {
                    todoList.reverse();
                });
                
                this.element.append(this.addButton);
                this.element.append(this.reverseButton);
                this.element.append(this.list = $('<ul>'));
                
                this.renderTasks();
                
                return this;
            },
            renderTasks : function () {
                var todoList = this.properties.model;
                
                var self = this;
                
                this.list.html('');
                
                // the view iterates over the tasks in the TodoList Model and renders the task
                $.each(todoList.getTasks(), function (index, task) {
                    self.renderTask(task);
                });
            },
            
            // will be called when the list is (re)rendered, or when a todoList.add(new TodoTask('boehoe'))
            // method is called. This actually updates the UI.
            renderTask : function (task) {
                var taskView = new TaskView({
                    'element' : this.list,
                    'model' : task
                });
                this.list.append(taskView.render().element);
            }
        });

        
        var list = new TodoList();
        list.add(new TodoTask('Just some tasks'));
        list.add(new TodoTask('We would like to start with'));

        var todoView = new TodoView({
            model : list 
        });
        
        $('body').append(todoView.render().element);
    });
})(jQuery);
