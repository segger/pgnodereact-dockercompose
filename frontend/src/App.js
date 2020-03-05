import React from 'react';
import './App.css';

function App() {
  const [todoItems, updateItems] = React.useState([]);

  React.useEffect(() => {
	  const getItems = async () => {
		  const response = await fetch(`${process.env.REACT_APP_ITEMS_API}/items`);
		  const items = await response.json();
		  if (items && Array.isArray(items) && items.length) {
			  // @ts-ignore
			  updateItems(items);
		  }
	  };
	  getItems();
  }, []);

  return (
    <div className="App">
	  { todoItems && todoItems.length ?
		  todoItems.map((item: any, i: number) => {
			  return (
				  <div key={i}>
				  	{`${item.item_name}`}
				  	<br/>
				  </div>
			  );
		  })
	  : 'No items'}
    </div>
  );
}

export default App;
