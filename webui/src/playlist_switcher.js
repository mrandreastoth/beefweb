import React from 'react'
import PropTypes from 'prop-types'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import PlaylistModel from './playlist_model'
import TouchSupport from './touch_support'
import { Icon } from './elements'
import urls from './urls'
import { bindHandlers } from './utils'

const PlaylistTabHandle = SortableHandle(() => (
    <Icon name='ellipses' className='drag-handle' />
));

const PlaylistTab = SortableElement(props => {
    const { playlist: p, currentId, drawHandle } = props;
    const handle = drawHandle ? <PlaylistTabHandle /> : null;
    const className = 'header-tab' + (p.id == currentId ? ' active' : '');

    return (
        <li className={className}>
            { handle }
            <a href={urls.viewPlaylist(p.id)} title={p.title}>
                {p.title}
            </a>
        </li>
    );
});

const PlaylistTabList = SortableContainer(props => {
    const { playlists, currentId, drawHandle } = props;

    return (
        <ul className='header-block header-block-primary'>
        {
            playlists.map(p => (
                <PlaylistTab
                    key={p.id}
                    index={p.index}
                    playlist={p}
                    currentId={currentId}
                    drawHandle={drawHandle} />
            ))
        }
        </ul>
    );
});

export default class PlaylistSwitcher extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { currentPlaylistId, playlists } = this.props.playlistModel;
        const touchMode = this.props.touchSupport.isEnabled;
        return { currentPlaylistId, playlists, touchMode };
    }

    componentDidMount()
    {
        this.props.playlistModel.on('playlistsChange', this.handleUpdate);
        this.props.touchSupport.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.playlistModel.off('playlistsChange', this.handleUpdate);
        this.props.touchSupport.off('change', this.handleUpdate);
    }

    handleSortEnd(e)
    {
        this.props.playlistModel.movePlaylist(e.oldIndex, e.newIndex);
    }

    render()
    {
        const { currentPlaylistId, playlists, touchMode } = this.state;

        return (
            <PlaylistTabList
                playlists={playlists}
                currentId={currentPlaylistId}
                onSortEnd={this.handleSortEnd}
                axis='x'
                lockAxis='x'
                helperClass='dragged'
                distance={touchMode ? null : 30}
                useDragHandle={touchMode}
                drawHandle={touchMode} />
        );
    }
}

PlaylistSwitcher.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    touchSupport: PropTypes.instanceOf(TouchSupport).isRequired
};
